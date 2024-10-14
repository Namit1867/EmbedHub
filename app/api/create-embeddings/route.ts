// import { NextApiRequest, NextApiResponse } from 'next';
// import { Configuration, OpenAIApi } from 'openai';
// import { PineconeClient } from '@pinecone-database/pinecone';

// const openai = new OpenAIApi(new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// }));

// const pinecone = new PineconeClient();
// pinecone.init({
//   apiKey: process.env.PINECONE_API_KEY,
//   environment: process.env.PINECONE_ENVIRONMENT,
// });

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const { text, provider, namespace } = req.body;

//   try {
//     // Create embeddings using OpenAI
//     const embeddingResponse = await openai.createEmbedding({
//       model: 'text-embedding-ada-002',
//       input: text,
//     });

//     const embeddings = embeddingResponse.data.data[0].embedding;

//     // Store embeddings in Pinecone
//     const pinecone_index = process.env.PINECONE_GITHUB_INDEX
//     const index = pinecone.Index(pinecone_index);
//     await index.upsert([{ id: namespace, values: embeddings }]);

//     res.status(200).json({ message: 'Embeddings created and stored successfully' });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to create embeddings' });
//   }
// }
