declare module 'bullmq' {
  export class Queue {
    name: string;
    constructor(name: string, opts?: any);
  }
  export class Worker {
    constructor(name: string, processor: any, opts?: any);
  }
  export interface Job<DataType = any> {
    data: DataType;
  }
}
