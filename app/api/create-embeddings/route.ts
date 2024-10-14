import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { CharacterTextSplitter } from "langchain/text_splitter";
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY || ""});

const pinecone = new Pinecone({apiKey: process.env.PINECONE_API_KEY || ""});

const splitter = new CharacterTextSplitter({
  separator: "\n\n",
  chunkSize: 256,
  chunkOverlap: 20,
});


export async function POST(request) {
  const { text, provider, namespace, resourceId } = await request.json();

  try {

    const documents = await splitter.createDocuments([text]);

    //metadata
    let metadata = [];
    let chunks = [];

    for (let i = 0; i < documents.length; i++) {
      metadata.push({
        "text": documents[i].pageContent,
        "resourceId": resourceId
      });
      chunks.push(documents[i].pageContent);
    }

    // Create embeddings using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: chunks,
    });

    console.log("Embedding Response:", embeddingResponse)

    const embeddings = embeddingResponse.data;

    // Extract vectors and generate unique IDs for each embedding
    const vectors: number[][] = embeddings.map((record) => record.embedding);
    const ids: string[] = Array.from({ length: embeddings.length }, () => uuidv4());

    // Prepare vector objects for Pinecone upsert
    const upsertVectors : any = ids.map((id, idx) => ({
        id,
        values: vectors[idx],
        metadata: metadata[idx],
    }));

    let pinecone_index = "";
    
    if (provider === 'github') {
      pinecone_index = process.env.PINECONE_GITHUB_INDEX || "";
    } else if (provider === 'google') {
      pinecone_index = process.env.PINECONE_GOOGLE_DRIVE_INDEX || "";
    } else {
      throw new Error('Invalid provider');
    }

    // Upsert the vectors and metadata into the Pinecone index
    const pinecone_index_instance = pinecone.Index(pinecone_index);
    console.log("upsertVectors", upsertVectors)

    const res = await pinecone_index_instance.namespace(namespace).upsert(
      [
        ...upsertVectors
      ],
    )

    return NextResponse.json({
      res
    });

  } catch (error) {
    console.error({ error: error });
  }
}
