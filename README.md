# Letter Boxed

A web-based clone of the NYT Letter Boxed puzzle game, deployable to Vercel.

## Game Rules

- You need to use all 12 letters to form words
- When forming a word, consecutive letters cannot be from the same side of the square
- The optimal solution uses exactly 2 words
- You win if you can solve it in 5 words or fewer

## How to Play

- **Click or drag** letters to form words
- **Type letters** on your keyboard to select them
- Press **Enter** to submit a word
- Press **Delete** to remove the last letter
- Press **Restart** to start over

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Shareable Results

After solving a puzzle, a modal appears with a copy-to-clipboard share message:
- "I solved Letter Boxed in X words!" with emojis
- Word lengths and solve time
- Emoji grid (Wordle/Connections style)
- "Play here 👉" with your site link

## Deployment to Vercel

1. Push your code to a Git repository
2. Import the project in Vercel
4. Vercel will automatically detect Next.js and deploy

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```