import * as DocumentPicker from 'expo-document-picker';

export async function shareCsv(filename: string, csv: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function pickCsv(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '.csv,text/csv' });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return asset.file ? asset.file.text() : (await fetch(asset.uri)).text();
}
