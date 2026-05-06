import { ChatOpenAI } from '@langchain/openai';
import { BaseMessageLike } from '@langchain/core/messages';
import { db } from '../db/index.js';
import { modelUsage } from '../db/schema.js';
import { env } from '../config/env.js';
import { logger } from './logger.js';
import { AIModel } from '@heritage-odyssey/shared/models';

interface ModelCallParams {
  model: AIModel;
  messages: BaseMessageLike[];
  userId?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * ModelRouter centralizes all AI model calls to ensure consistent
 * logging, cost tracking, and configuration.
 */
export const ModelRouter = {
  /**
   * Wrapper for ChatOpenAI calls that logs token usage to the database.
   */
  async chat(params: ModelCallParams) {
    const { model, messages, userId, temperature = 0.7, maxTokens } = params;

    const chatModel = new ChatOpenAI({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: model,
      temperature,
      maxTokens,
    });

    try {
      const response = await chatModel.invoke(messages);

      const usage = response.usage_metadata;

      if (usage) {
        // Background log to avoid blocking the response
        this.logUsage({
          userId,
          modelName: model,
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.total_tokens,
          endpoint: 'chat/completions',
        }).catch((err) => logger.error('Failed to log model usage', err));
      }

      return response;
    } catch (error) {
      logger.error(`ModelRouter Error [${model}]:`, error);
      throw error;
    }
  },

  /**
   * Internal helper to persist usage statistics.
   */
  async logUsage(data: {
    userId?: string;
    modelName: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    endpoint: string;
  }) {
    await db.insert(modelUsage).values({
      userId: data.userId || null,
      modelName: data.modelName,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens: data.totalTokens,
      endpoint: data.endpoint,
    });
  },
};
