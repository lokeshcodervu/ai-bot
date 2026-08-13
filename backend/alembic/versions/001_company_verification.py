"""Add company verification columns, document metadata, and audit_logs table

Revision ID: 001_company_verification
Revises: 
Create Date: 2026-08-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_company_verification'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # 1. Extend tenants table
    op.add_column('tenants', sa.Column('country', sa.String(length=100), server_default='INDIA', nullable=True))
    op.add_column('tenants', sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tenants', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tenants', sa.Column('verified_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))
    op.create_index('idx_tenant_verification_status', 'tenants', ['verification_status'])

    # 2. Extend documents table
    op.add_column('documents', sa.Column('document_type', sa.String(length=100), nullable=True))
    op.add_column('documents', sa.Column('mime_type', sa.String(length=100), nullable=True))
    op.add_column('documents', sa.Column('file_size', sa.BigInteger(), nullable=True))
    op.add_column('documents', sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))
    op.add_column('documents', sa.Column('verification_status', sa.String(length=50), server_default='PENDING', nullable=True))
    op.create_index('idx_documents_tenant_type', 'documents', ['tenant_id', 'document_type'])

    # 3. Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('performed_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('previous_status', sa.String(length=50), nullable=True),
        sa.Column('new_status', sa.String(length=50), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('idx_audit_tenant_created', 'audit_logs', ['tenant_id', 'created_at'])
    op.create_index('idx_audit_action', 'audit_logs', ['action'])

    # 4. Migrate existing active/verified tenants to APPROVED
    op.execute("UPDATE tenants SET verification_status = 'APPROVED' WHERE (is_active = true OR is_verified = true) AND (submitted_at IS NULL OR verification_status = 'PENDING')")

def downgrade():
    op.drop_table('audit_logs')
    op.drop_index('idx_documents_tenant_type', table_name='documents')
    op.drop_column('documents', 'verification_status')
    op.drop_column('documents', 'uploaded_by')
    op.drop_column('documents', 'file_size')
    op.drop_column('documents', 'mime_type')
    op.drop_column('documents', 'document_type')
    op.drop_index('idx_tenant_verification_status', table_name='tenants')
    op.drop_column('tenants', 'verified_by')
    op.drop_column('tenants', 'verified_at')
    op.drop_column('tenants', 'submitted_at')
    op.drop_column('tenants', 'country')
