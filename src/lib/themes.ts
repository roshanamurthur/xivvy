import { loadConfig } from './config.js';

export interface Theme {
  name: string;
  keywords: string[];
  categories?: string[];
}

const DEFAULT_THEMES: Theme[] = [
  {
    name: 'Machine Learning',
    keywords: ['machine learning', 'deep learning', 'neural network', 'training', 'optimization', 'gradient'],
    categories: ['cs.LG'],
  },
  {
    name: 'NLP',
    keywords: ['language model', 'LLM', 'NLP', 'text generation', 'natural language', 'translation', 'tokeniz'],
    categories: ['cs.CL'],
  },
  {
    name: 'Computer Vision',
    keywords: ['vision', 'image', 'video', 'object detection', 'segmentation', 'visual', 'diffusion'],
    categories: ['cs.CV'],
  },
  {
    name: 'Multimodal',
    keywords: ['multimodal', 'vision-language', 'VLM', 'image-text', 'cross-modal'],
    categories: ['cs.MM'],
  },
  {
    name: 'AI Agents',
    keywords: ['agent', 'tool use', 'planning', 'agentic', 'autonomous', 'reasoning'],
    categories: ['cs.AI'],
  },
  {
    name: 'Reinforcement Learning',
    keywords: ['reinforcement learning', 'reward', 'policy', 'RLHF', 'PPO', 'environment'],
    categories: ['cs.LG'],
  },
  {
    name: 'Robotics',
    keywords: ['robot', 'manipulation', 'navigation', 'embodied', 'locomotion', 'grasp'],
    categories: ['cs.RO'],
  },
  {
    name: 'AI Safety',
    keywords: ['alignment', 'safety', 'interpretability', 'bias', 'fairness', 'jailbreak', 'red team'],
    categories: ['cs.AI'],
  },
];

export function getThemes(): Theme[] {
  const config = loadConfig();
  if (config.themes && config.themes.length > 0) {
    return config.themes;
  }
  return DEFAULT_THEMES;
}
