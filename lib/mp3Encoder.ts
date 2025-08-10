/**
 * Asynchronously encodes an AudioBuffer to an MP3 Blob using a Web Worker to prevent UI freezing.
 * @param audioBuffer The AudioBuffer to encode.
 * @param bitrate The desired bitrate in kbps.
 * @returns A Promise that resolves with the encoded MP3 Blob.
 */
export function encodeMp3(audioBuffer: AudioBuffer, bitrate: number = 192): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const workerCode = `
            self.importScripts('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js');
            
            function floatTo16BitPCM(input) {
                const output = new Int16Array(input.length);
                for (let i = 0; i < input.length; i++) {
                    const s = Math.max(-1, Math.min(1, input[i]));
                    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                return output;
            }
            
            self.onmessage = (event) => {
                const { audioData, bitrate } = event.data;
                try {
                    const mp3encoder = new self.lamejs.Mp3Encoder(audioData.numberOfChannels, audioData.sampleRate, bitrate);
                    const mp3Data = [];
            
                    const leftFloat = new Float32Array(audioData.left);
                    const leftInt16 = floatTo16BitPCM(leftFloat);
                    let rightInt16 = undefined;
            
                    if (audioData.numberOfChannels > 1 && audioData.right) {
                        const rightFloat = new Float32Array(audioData.right);
                        rightInt16 = floatTo16BitPCM(rightFloat);
                    }
            
                    const samplesPerFrame = 1152;
                    
                    for (let i = 0; i < leftInt16.length; i += samplesPerFrame) {
                        const leftChunk = leftInt16.subarray(i, i + samplesPerFrame);
                        let rightChunk = undefined;
            
                        if (audioData.numberOfChannels > 1 && rightInt16) {
                            rightChunk = rightInt16.subarray(i, i + samplesPerFrame);
                        }
                        
                        const mp3buf = audioData.numberOfChannels === 1 
                            ? mp3encoder.encodeBuffer(leftChunk)
                            : mp3encoder.encodeBuffer(leftChunk, rightChunk);
            
                        if (mp3buf.length > 0) {
                            mp3Data.push(new Int8Array(mp3buf));
                        }
                    }
                    
                    const d = mp3encoder.flush();
                    if (d.length > 0) {
                        mp3Data.push(new Int8Array(d));
                    }
            
                    const mp3Blob = new Blob(mp3Data, { type: 'audio/mpeg' });
                    self.postMessage({ status: 'done', blob: mp3Blob });
                } catch (error) {
                    self.postMessage({ status: 'error', message: error.message });
                }
            };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        const cleanup = () => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        };

        worker.onmessage = (e) => {
            if (e.data.status === 'done') {
                resolve(e.data.blob);
            } else {
                reject(new Error(e.data.message || 'MP3 encoding failed in worker.'));
            }
            cleanup();
        };

        worker.onerror = (e) => {
            reject(new Error(`Worker error: ${e.message}`));
            cleanup();
        };

        const audioData = {
            numberOfChannels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
            left: audioBuffer.getChannelData(0).buffer.slice(0),
            right: audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1).buffer.slice(0) : null,
        };

        const transferableObjects = [audioData.left];
        if (audioData.right) {
            transferableObjects.push(audioData.right);
        }

        worker.postMessage({ audioData, bitrate }, { transfer: transferableObjects as Transferable[] });
    });
}