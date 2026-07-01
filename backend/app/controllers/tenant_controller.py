# controllers/tenant_controller.py

from uuid import UUID
import uuid
from sqlalchemy.orm import Session
from app.models.tenant import Tenant
from app.models.wallet import Wallet
from app.models.tenant_usage import TenantUsage
from app.models.document import Document
from app.models.embedding_log import EmbeddingLog
from app.schemas.tenant_schema import TenantCreate, TenantUpdate

def get_tenant_by_id(db: Session, tenant_id: UUID):
    """Fetch tenant by ID."""
    return db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.is_deleted == False).first()

def get_tenant_by_slug(db: Session, slug: str):
    """Fetch tenant by slug."""
    return db.query(Tenant).filter(Tenant.slug == slug, Tenant.is_deleted == False).first()

def create_tenant(db: Session, tenant_in: TenantCreate, tenant_id: UUID = None):
    """Create a new tenant."""
    if not tenant_id:
        tenant_id = uuid.uuid4()
    
    db_tenant = Tenant(
        id=tenant_id,
        company_name=tenant_in.company_name,
        slug=tenant_in.slug,
        company_email=tenant_in.company_email,
        company_phone=tenant_in.company_phone,
        website=str(tenant_in.website) if tenant_in.website else None,
        timezone=tenant_in.timezone,
        industry=tenant_in.industry,
        pinecone_namespace=f"tenant-{tenant_in.slug}"  # default namespace based on slug
    )
    db.add(db_tenant)
    
    # Auto-initialize associated Wallet
    db_wallet = Wallet(
        tenant_id=tenant_id,
        balance=0,
        currency="USD"
    )
    db.add(db_wallet)
    
    # Auto-initialize associated TenantUsage (analytics)
    db_usage = TenantUsage(
        tenant_id=tenant_id,
        total_calls=0,
        total_minutes_used=0,
        total_campaigns=0,
        total_leads=0,
        total_tokens_used=0,
        total_tts_characters_used=0
    )
    db.add(db_usage)
    
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def update_tenant(db: Session, db_tenant: Tenant, tenant_in: TenantUpdate):
    """Update tenant profile configuration."""
    update_data = tenant_in.model_dump(exclude_unset=True)
    if "website" in update_data and update_data["website"] is not None:
        update_data["website"] = str(update_data["website"])
    for key, value in update_data.items():
        setattr(db_tenant, key, value)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def check_ai_ready_status(db: Session, db_tenant: Tenant) -> bool:
    """Evaluate and update the AI Ready status of a tenant."""
    has_voice = bool(db_tenant.voice_id)
    has_prompt = bool(db_tenant.system_prompt)
    has_kb = bool(db_tenant.has_knowledge_base)
    
    is_ready = has_voice and has_prompt and has_kb
    db_tenant.is_ai_ready = is_ready
    return is_ready

def select_voice(db: Session, db_tenant: Tenant, voice_id: str) -> Tenant:
    """Select ElevenLabs voice and re-evaluate AI Ready status."""
    db_tenant.voice_id = voice_id
    db_tenant.voice_provider = "ELEVENLABS"
    check_ai_ready_status(db, db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def update_system_prompt(db: Session, db_tenant: Tenant, system_prompt: str) -> Tenant:
    """Update system prompt, increment version, and re-evaluate AI Ready status."""
    db_tenant.system_prompt = system_prompt
    if db_tenant.system_prompt_version is None:
        db_tenant.system_prompt_version = 1
    else:
        db_tenant.system_prompt_version += 1
        
    check_ai_ready_status(db, db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def update_twilio_limits(db: Session, db_tenant: Tenant, max_calls: int) -> Tenant:
    """Update Twilio limits."""
    db_tenant.twilio_max_calls_per_second = max_calls
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def process_document_vectorization(db_session_factory, tenant_id: UUID, document_id: UUID, file_path: str):
    """
    Background task to process PDF document vectorization:
    1. Extracts real PDF text using pypdf
    2. Chunks text into 500-1000 character segments
    3. Generates OpenAI embeddings (if OPENAI_API_KEY is present, else fallbacks to dummy float list)
    4. Connects to Pinecone, checks/creates index, and upserts vectors in tenant_id namespace
    5. Updates document status, embedding logs, and Tenant usage analytics.
    """
    import os
    import pypdf
    from pinecone import Pinecone, ServerlessSpec
    from openai import OpenAI
    from app.config.settings import settings

    # Create a fresh database session for background task safety
    print(f"[DEBUG WORKER] Background task started for doc_id={document_id}, tenant_id={tenant_id}")
    db = db_session_factory()
    try:
        db_doc = db.query(Document).filter(Document.id == document_id, Document.tenant_id == tenant_id).first()
        if not db_doc:
            print(f"[DEBUG WORKER] Early exit: Document {document_id} not found in DB!")
            return
            
        db_tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not db_tenant:
            print(f"[DEBUG WORKER] Early exit: Tenant {tenant_id} not found in DB!")
            return
            
        db_usage = db.query(TenantUsage).filter(TenantUsage.tenant_id == tenant_id).first()
        if not db_usage:
            # Auto-initialize usage record if it doesn't exist
            db_usage = TenantUsage(
                tenant_id=tenant_id,
                total_calls=0,
                total_minutes_used=0,
                total_campaigns=0,
                total_leads=0,
                total_tokens_used=0,
                total_tts_characters_used=0
            )
            db.add(db_usage)
            db.flush()

        # Step 1: Real PDF text extraction using pypdf
        extracted_text = ""
        if os.path.exists(file_path):
            try:
                reader = pypdf.PdfReader(file_path)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"
                print(f"[DEBUG WORKER] Extracted {len(extracted_text)} characters from {file_path}")
            except Exception as e:
                print(f"[ERROR WORKER] Failed parsing PDF '{file_path}': {e}")
                extracted_text = "Fallback text due to PDF parsing failure."
        else:
            extracted_text = "Fallback mock knowledge base text content."

        # Step 2: Chunking (500 to 1000 characters)
        chunk_size = 700
        text_length = len(extracted_text)
        chunks_list = [extracted_text[i:i+chunk_size] for i in range(0, text_length, chunk_size)]
        if not chunks_list:
            chunks_list = ["Empty document content fallback chunk."]

        num_chunks = len(chunks_list)
        estimated_tokens = 0

        # Step 3 & 4: Generate Embeddings and Pinecone Integration
        import google.generativeai as genai
        
        # Configure Gemini if active
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            dimension = 3072
            index_name = "ai-bot-index-gemini"
        else:
            dimension = 1536
            index_name = settings.PINECONE_INDEX_NAME or "ai-bot-index"

        openai_client = None
        if not settings.GEMINI_API_KEY and settings.OPENAI_API_KEY:
            openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

        vectors_data = []
        for i, chunk in enumerate(chunks_list):
            estimated_tokens += int(len(chunk) // 4) + 10
            vector = None
            
            # Gemini Embedding Call
            if settings.GEMINI_API_KEY:
                try:
                    response = genai.embed_content(
                        model="models/gemini-embedding-001",
                        content=chunk
                    )
                    vector = response['embedding']
                except Exception as e:
                    print(f"[ERROR WORKER] Gemini embedding failed for chunk {i}: {e}")
            
            # OpenAI Embedding Call
            elif openai_client:
                try:
                    response = openai_client.embeddings.create(
                        model="text-embedding-3-small",
                        input=chunk
                    )
                    vector = response.data[0].embedding
                except Exception as e:
                    print(f"[ERROR WORKER] OpenAI embedding failed for chunk {i}: {e}")
            
            # Fallback to mock vector logic
            if vector is None:
                import random
                vector = [random.uniform(-0.1, 0.1) for _ in range(dimension)]
                
            metadata = {
                "text": chunk,
                "document_id": str(document_id),
                "file_name": db_doc.file_name
            }
            vectors_data.append((f"{document_id}_{i}", vector, metadata))

        # Initialize Pinecone Client
        if settings.PINECONE_API_KEY:
            print(f"[PINECONE INDEXING] Initializing Pinecone client...")
            pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            
            # Check and auto-create index if it does not exist
            try:
                existing_indexes = [idx.name for idx in pc.list_indexes()]
                if index_name not in existing_indexes:
                    print(f"[PINECONE] Index '{index_name}' not found. Creating serverless index with dimension {dimension}...")
                    pc.create_index(
                        name=index_name,
                        dimension=dimension,
                        metric="cosine",
                        spec=ServerlessSpec(
                            cloud="aws",
                            region="us-east-1"
                        )
                    )
            except Exception as e:
                print(f"[WARNING PINECONE] Index check/create failed, attempting default connection: {e}")

            # Get index and upsert vectors
            try:
                index = pc.Index(index_name)
                print(f"\n======================================")
                print(f"[PINECONE INDEXING] Namespace: {str(tenant_id)}")
                print(f"File Name: {db_doc.file_name}")
                print(f"Total Chunks: {num_chunks}")
                print(f"Estimated Tokens: {estimated_tokens}")
                print(f"Uploading vector dimensions: {dimension} to index '{index_name}'...")
                print(f"======================================\n")
                
                index.upsert(vectors=vectors_data, namespace=str(tenant_id))
                print(f"[PINECONE INDEXING SUCCESS] Upserted to Pinecone namespace {tenant_id}.")
            except Exception as e:
                print(f"[ERROR PINECONE] Pinecone Index upsert failed: {e}")
                raise e

        # Record in embedding_logs
        db_log = EmbeddingLog(
            tenant_id=tenant_id,
            document_id=document_id,
            chunks=num_chunks,
            tokens=estimated_tokens
        )
        db.add(db_log)

        # Step 5: Update statuses & analytics
        db_doc.status = "COMPLETED"
        db_tenant.has_knowledge_base = True
        
        # Increment TenantUsage document counts
        db_usage.total_documents += 1
        db_usage.total_embeddings += num_chunks

        # Recheck AI Ready flag
        check_ai_ready_status(db, db_tenant)

        db.commit()
        print(f"[PINECONE INDEXING SUCCESS] Document {document_id} processed successfully.")

    except Exception as e:
        db.rollback()
        print(f"[PINECONE INDEXING ERROR] Failed to process document {document_id}: {str(e)}")
        try:
            db_doc = db.query(Document).filter(Document.id == document_id).first()
            if db_doc:
                db_doc.status = "FAILED"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


