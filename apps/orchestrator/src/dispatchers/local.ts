import axios from 'axios';

const COMFYUI_URL = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';

export async function submitToComfyUI(workflowJson: any): Promise<string> {
  try {
    const payload = { prompt: workflowJson };
    const response = await axios.post(`${COMFYUI_URL}/prompt`, payload);
    return response.data.prompt_id;
  } catch (error: any) {
    console.error('Error submitting to ComfyUI:', error.message);
    throw new Error('Failed to submit workflow to local ComfyUI worker');
  }
}

export async function pollComfyUI(promptId: string, timeoutMs: number = 120000): Promise<{ imageBytes: Buffer }> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await axios.get(`${COMFYUI_URL}/history/${promptId}`);
      const history = response.data;
      
      if (history[promptId]) {
        // Job is complete
        const outputs = history[promptId].outputs;
        for (const nodeId in outputs) {
          if (outputs[nodeId].images && outputs[nodeId].images.length > 0) {
            const imgInfo = outputs[nodeId].images[0];
            const imageResponse = await axios.get(`${COMFYUI_URL}/view`, {
              params: {
                filename: imgInfo.filename,
                subfolder: imgInfo.subfolder || '',
                type: imgInfo.type
              },
              responseType: 'arraybuffer' // Get binary data
            });
            
            return { imageBytes: Buffer.from(imageResponse.data) };
          }
        }
        throw new Error('Job completed but no image output found in history');
      }
    } catch (error: any) {
      console.error(`Polling error for ${promptId}:`, error.message);
    }
    
    // Wait 2 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error(`Job ${promptId} timed out after ${timeoutMs}ms`);
}
