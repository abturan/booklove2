declare module 'heic-convert' {
  type ConvertOptions = {
    buffer: ArrayBuffer | Uint8Array | Buffer
    format: 'JPEG' | 'PNG'
    quality?: number
  }

  type ConvertFn = (options: ConvertOptions) => Promise<Buffer | Uint8Array>

  const convert: ConvertFn & {
    all: (options: ConvertOptions) => Promise<Array<{ convert: () => Promise<Buffer | Uint8Array> }>>
  }

  export = convert
}

