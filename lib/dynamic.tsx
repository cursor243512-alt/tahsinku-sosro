import dynamic from 'next/dynamic';

export function loadClient(
  importer: () => Promise<any>
) {
  return dynamic<any>(async () => importer(), {
    ssr: false,
    loading: () => null,
  }) as any;
}
