# utils/pubsub.py

import json
import asyncio
from typing import Dict, Set, Optional, Any
import redis.asyncio as aioredis
from app.config.settings import settings

class InMemoryBroker:
    def __init__(self):
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()

    async def publish(self, channel: str, message: dict):
        async with self._lock:
            if channel in self._subscribers:
                for queue in self._subscribers[channel]:
                    queue.put_nowait(message)

    async def subscribe(self, channel: str) -> asyncio.Queue:
        async with self._lock:
            queue = asyncio.Queue()
            if channel not in self._subscribers:
                self._subscribers[channel] = set()
            self._subscribers[channel].add(queue)
            return queue

    async def unsubscribe(self, channel: str, queue: asyncio.Queue):
        async with self._lock:
            if channel in self._subscribers:
                self._subscribers[channel].discard(queue)
                if not self._subscribers[channel]:
                    del self._subscribers[channel]

class RedisPubSubBroker:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self) -> bool:
        try:
            self.redis = aioredis.from_url(self.redis_url, decode_responses=True)
            await self.redis.ping()
            print("[PUBSUB] Connected to Redis Pub/Sub successfully.")
            return True
        except Exception as e:
            print(f"[PUBSUB] Redis connection failed: {e}")
            self.redis = None
            return False

    async def publish(self, channel: str, message: dict):
        if self.redis:
            try:
                await self.redis.publish(channel, json.dumps(message))
            except Exception as e:
                print(f"[PUBSUB] Redis publish error: {e}")
        else:
            raise RuntimeError("Redis not connected.")

class DynamicPubSubBroker:
    def __init__(self):
        # Read Redis URL from settings or environment, fallback to default
        self.redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
        self.redis_broker: Optional[RedisPubSubBroker] = None
        self.in_memory_broker = InMemoryBroker()
        self.use_redis = False
        self._initialized = False
        self._init_lock = asyncio.Lock()

    async def initialize(self):
        async with self._init_lock:
            if self._initialized:
                return
            self.redis_broker = RedisPubSubBroker(self.redis_url)
            connected = await self.redis_broker.connect()
            if connected:
                self.use_redis = True
            else:
                self.use_redis = False
                print("[PUBSUB] Redis server unavailable. Using In-Memory Pub/Sub fallback.")
            self._initialized = True

    async def publish(self, channel: str, message: dict):
        if not self._initialized:
            await self.initialize()
        
        # Always broadcast to in-memory queues for fallback/local tests
        await self.in_memory_broker.publish(channel, message)
        
        if self.use_redis:
            try:
                await self.redis_broker.publish(channel, message)
            except Exception:
                # If Redis connection drops during runtime, fallback gracefully
                pass

    async def subscribe(self, channel: str) -> Any:
        if not self._initialized:
            await self.initialize()
            
        if self.use_redis and self.redis_broker.redis:
            pubsub = self.redis_broker.redis.pubsub()
            await pubsub.subscribe(channel)
            return pubsub
        else:
            return await self.in_memory_broker.subscribe(channel)

    async def unsubscribe(self, channel: str, subscription: Any):
        if self.use_redis and self.redis_broker.redis:
            try:
                await subscription.unsubscribe(channel)
                await subscription.close()
            except Exception:
                pass
        else:
            await self.in_memory_broker.unsubscribe(channel, subscription)

pubsub_broker = DynamicPubSubBroker()

def publish_sync(channel: str, message: dict):
    """Thread-safe synchronous wrapper to publish messages to the Pub/Sub broker."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # Schedule the task on the running loop
        asyncio.run_coroutine_threadsafe(pubsub_broker.publish(channel, message), loop)
    else:
        # Run in a temporary loop
        asyncio.run(pubsub_broker.publish(channel, message))
