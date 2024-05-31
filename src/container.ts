export interface IFactory<T, Args extends unknown[]> {
  produce: (...args: Args) => T;
}

export type FactoryClass<T, Args extends unknown[]> = new () => IFactory<
  T,
  Args
>;

type EmptyArrayKeys<T> = {
  [K in keyof T]: T[K] extends [] ? K : never;
}[keyof T];

type InjectableEntry<T, Args extends unknown[]> =
  | { type: "factory"; factory: IFactory<T, Args> }
  | { type: "class"; cls: new (...args: Args) => T };

interface Mapping {
  [key: string | number | symbol]: any[];
}

export class ContainerInstance<IM extends Mapping = any> {
  #injectables: Map<keyof IM, InjectableEntry<any, any>> = new Map();
  #instances: Map<keyof IM, any> = new Map();

  public Injectable =
    (key: keyof IM) => (target: any, context: ClassDecoratorContext) => {
      if (this.#injectables.has(key)) {
        throw new Error(`injectable '${context.name}' already registered`);
      }
      this.#injectables.set(key, { type: "class", cls: target });
      return target;
    };

  public Factory =
    <K extends keyof IM, F extends FactoryClass<any, IM[K]>>(key: K) =>
    (target: F, context: ClassDecoratorContext) => {
      if (this.#injectables.has(key)) {
        throw new Error(`injectable '${context.name}' already registered`);
      }
      this.#injectables.set(key, { type: "factory", factory: new target() });
      return target;
    };

  public Inject =
    <K extends EmptyArrayKeys<IM>>(key: K) =>
    (target: undefined, context: ClassFieldDecoratorContext) => {
      if (context.private) {
        throw new Error(
          `cannot inject into private field '${String(context.name)}'`,
        );
      }
      const instance = this.get(key);
      this.#instances.set(key, instance);
      const fieldName = context.name;
      context.addInitializer(function (this: any) {
        this[fieldName] = instance;
      });
    };

  public Transient =
    <K extends keyof IM>(key: K, ...args: IM[K]) =>
    (target: undefined, context: ClassFieldDecoratorContext) => {
      if (context.private) {
        throw new Error(
          `cannot inject into private field '${String(context.name)}'`,
        );
      }
      const instance = this.create(key, ...args);
      const fieldName = context.name;
      context.addInitializer(function (this: any) {
        this[fieldName] = instance;
      });
    };

  public set(key: string, instance: any): void {
    if (this.#instances.has(key)) {
      throw new Error(`instance with key "${key}" already exists`);
    }
    this.#instances.set(key, instance);
  }

  public get<K extends EmptyArrayKeys<IM>>(key: K): any {
    // This will fail if contructor has args, and we do not pass them to create
    // @ts-expect-error
    return this.#instances.get(key) ?? this.create(key);
  }

  public create<K extends keyof IM>(key: K, ...args: IM[K]): any {
    const entry = this.#injectables.get(key);
    if (!entry) {
      throw new Error(`injectable '${String(key)}' not registered`);
    }
    return entry.type === "class"
      ? new entry.cls(...args)
      : entry.factory.produce(...args);
  }
}

export const Container = new ContainerInstance();
