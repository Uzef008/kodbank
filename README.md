# kodbank

## Setup Instructions

1. **Environment Variables**: This project requires a Hugging Face API key to run features that depend on `api-inference.huggingface.co`. 
2. Create a `.env` file in the root of the project.
3. Add your `HF_API_KEY` to the `.env` file (see `.env.example` for reference).

```env
HF_API_KEY=your_actual_token_here
```

**Security Warning**: Never commit your `.env` file or hardcode tokens in the codebase!