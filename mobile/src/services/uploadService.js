import api from './api';
import axios from 'axios';

/**
 * Solicita presigned URLs para o backend e faz upload direto ao S3.
 * files: [{ uri, name, type }]
 */
export const presignAndUpload = async (files) => {
  // Primeiro pede presigned URLs
  const filesMeta = files.map(f => ({ name: f.name, type: f.type }));
  const resp = await api.post('/comunicacao/momentos/presign/', { files: filesMeta });
  const presigns = resp.data; // [{ key, url, fields }]

  // Faz upload via axios para cada presigned POST
  const uploadedKeys = [];
  for (let i = 0; i < presigns.length; i++) {
    const p = presigns[i];
    const file = files[i];

    const formData = new FormData();
    // Adiciona os fields retornados pelo presign
    Object.keys(p.fields || {}).forEach(k => {
      formData.append(k, p.fields[k]);
    });

    // Adiciona o arquivo
    const blob = await (await fetch(file.uri)).blob();
    formData.append('file', blob, file.name);

    // Envia para a URL presigned
    await axios.post(p.url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    uploadedKeys.push(p.key);
  }

  return uploadedKeys; // chaves que o backend pode salvar como referência
};

export default { presignAndUpload };
