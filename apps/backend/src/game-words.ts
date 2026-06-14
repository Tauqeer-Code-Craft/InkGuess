export const GAME_WORDS = ['apple', 'banana', 'orange', 'strawberry', 'pineapple', 'grape', 'watermelon', 'cherry', 'mango', 'peach',
  'cat', 'dog', 'elephant', 'lion', 'tiger', 'giraffe', 'zebra', 'monkey', 'panda', 'penguin',
  'guitar', 'piano', 'drums', 'violin', 'trumpet', 'flute', 'harp', 'microphone', 'headphones',
  'car', 'airplane', 'ship', 'bicycle', 'motorcycle', 'rocket', 'train', 'submarine', 'helicopter',
  'house', 'castle', 'bridge', 'lighthouse', 'windmill', 'skyscraper', 'tent', 'igloo', 'pyramid',
  'pizza', 'hamburger', 'sandwich', 'hotdog', 'sushi', 'taco', 'pancake', 'cookie', 'icecream', 'donut',
  'sun', 'moon', 'star', 'cloud', 'rainbow', 'lightning', 'snowflake', 'volcano', 'tornado', 'ocean',
  'computer', 'phone', 'television', 'robot', 'clock', 'key', 'umbrella', 'book', 'pencil', 'scissors',
  'football', 'basketball', 'tennis', 'baseball', 'soccer', 'golf', 'swimming', 'skateboarding', 'skiing',
  'flower', 'tree', 'cactus', 'mushroom', 'leaf', 'rose', 'sunflower', 'clover', 'palm', 'forest',
  'ghost', 'dragon', 'unicorn', 'alien', 'monster', 'wizard', 'superman', 'batman', 'pirate', 'ninja'];

export function getRandomWords(count=3){
    const shuffled = [...GAME_WORDS].sort(()=>0.5 - Math.random());
    return shuffled.slice(0,count)
}