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

export function matchTheme(topic: string): Theme {
  const themes = getThemes();
  const lower = topic.toLowerCase();

  // Score each theme by keyword overlap
  let bestTheme = themes[0];
  let bestScore = 0;

  for (const theme of themes) {
    let score = 0;
    // Check if topic words appear in theme name
    if (theme.name.toLowerCase().includes(lower)) score += 3;
    // Check if topic words appear in theme keywords
    for (const kw of theme.keywords) {
      if (lower.includes(kw.toLowerCase()) || kw.toLowerCase().includes(lower)) {
        score += 2;
      }
    }
    // Check individual words
    const topicWords = lower.split(/\s+/);
    for (const word of topicWords) {
      if (word.length < 3) continue;
      if (theme.name.toLowerCase().includes(word)) score += 1;
      for (const kw of theme.keywords) {
        if (kw.toLowerCase().includes(word)) score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }

  // If no good match, create an ad-hoc theme from the topic
  if (bestScore === 0) {
    return {
      name: topic,
      keywords: topic.split(/\s+/).filter((w) => w.length >= 3),
    };
  }

  return bestTheme;
}
