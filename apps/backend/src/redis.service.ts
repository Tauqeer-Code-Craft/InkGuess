import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy{
    private readonly logger = new Logger(RedisService.name);
    private client: Redis | null = null;
    private isConnected = false;
    private inMemoryStore = new Map<string,string>();
    private inMemorySets = new Map<string,Set<string>>();

    async onModuleInit() {
        this.logger.log('Initializing Redis Connection...');
        try {
            this.client = new Redis({
                host: process.env.REDIS_HOST || '127.0.0.1', 
                port: Number(process.env.REDIS_PORT) || 6379,
                connectTimeout: 2000,
                lazyConnect: true,
                maxRetriesPerRequest: 1,
            });

            this.client.on('error',(err)=> {
                this.logger.warn(`Redis connection error: ${err.message}. Falling back to in-memory store.`);
                this.isConnected = false;
            })

            this.client.on('connect', ()=> {
                this.logger.log('Redis connected successfully.');
                this.isConnected = true;
            });

            await this.client.connect();
            this.isConnected = true;
        } catch (error: any) {
            this.logger.warn(`Could not connect to Redis: ${error.message}. Using in-memory store fallback.`);
            this.isConnected = false;
            this.client = null;
        }
    }

    async set(key: string,value:string,ttlSeconds?: number): Promise<void>{
        if (this.isConnected && this.client){
            try {
                if (ttlSeconds) {
                    await this.client.set(key,value ,'EX',ttlSeconds);
                } else {
                    await this.client.set(key,value);
                }
                return;
            } catch (error: any) {
                this.logger.warn(`Redis SET error: ${error.message}. Falling back to in-memory`);
            }
        }
        this.inMemoryStore.set(key,value);
        // Handle in-memory TTL if needed (simple implementation)
        if(ttlSeconds){
            setTimeout(()=>{
                this.inMemoryStore.delete(key);
            },ttlSeconds * 1000);
        }
    }
    async get(key:string): Promise<string | null>{
        if (this.isConnected && this.client) {
            try {
                return await this.client.get(key);
            } catch (error: any) {
                this.logger.warn(`Redis GET error: ${error.message}. Falling back to in-memory.`);       
            }
        }
        return this.inMemoryStore.get(key) || null;
    }

    async del(key: string): Promise<void>{
        if(this.isConnected && this.client){
            try {
                await this.client.del(key);
                return;
            } catch (error: any) {
                this.logger.warn(`Redis DEL error: ${error.message}. Falling back to in-memory.`);       
            }
        }
        this.inMemoryStore.delete(key);
        this.inMemorySets.delete(key);
    }

    async sadd(key: string,member: string): Promise<void>{
        if (this.isConnected && this.client) {
            try {
                await this.client.sadd(key,member);
                return;
            } catch (error: any) {
                this.logger.warn(`Redis SADD error: ${error.message}. Falling back to in-memory.`);       
            }
        }
        if (!this.inMemorySets.has(key)) {
            this.inMemorySets.set(key,new Set());
        }
        this.inMemorySets.get(key)!.add(member);
    }

    async srem(key: string,member: string): Promise<void> {
        if (this.isConnected && this.client) {
            try {
                await this.client.srem(key,member);
                return;
            } catch (error: any) {
                this.logger.warn(`Redis SREM error: ${error.message}. Falling back to in-memory.`);                       
            }
        }
        if(this.inMemorySets.has(key)){
            this.inMemorySets.get(key)!.delete(member);
        }
    }

    async smembers(key: string): Promise<string[]>{
        if (this.isConnected && this.client) {
            try {
                return await this.client.smembers(key);
            } catch (error: any) {
                this.logger.warn(`Redis SMEMBERS error: ${error.message}. Falling back to in-memory.`);       
            }
        }
        if (this.inMemorySets.has(key)) {
            return Array.from(this.inMemorySets.get(key)!);
        }
        return [];
    }

    async onModuleDestroy() {
        if(this.client){
            await this.client.quit();
        }
    }
}