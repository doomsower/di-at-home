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
  #factories: Map<keyof IM, FactoryClass<any, any>> = new Map();

  public Injectable =
    (key: keyof IM) => (target: any, _context: ClassDecoratorContext) => {
      this.registerClass(key, target);
      return target;
    };

  public Factory =
    <K extends keyof IM, F extends FactoryClass<any, IM[K]>>(key: K) =>
    (target: F, _context: ClassDecoratorContext) => {
      this.registerFactory(key, target);
      return target;
    };

  public Inject =
    <K extends EmptyArrayKeys<IM>>(key: K) =>
    (_target: undefined, context: ClassFieldDecoratorContext) => {
      if (context.private) {
        throw new Error(
          `cannot inject into private field '${String(context.name)}'`,
        );
      }
      const container = this;
      const fieldName = context.name;
      context.addInitializer(function (this: any) {
        const instance = container.get(key);
        container.#instances.set(key, instance);
        this[fieldName] = instance;
      });
    };

  public Transient =
    <K extends keyof IM>(key: K, ...args: IM[K]) =>
    (_target: undefined, context: ClassFieldDecoratorContext) => {
      if (context.private) {
        throw new Error(
          `cannot inject into private field '${String(context.name)}'`,
        );
      }
      const container = this;
      context.addInitializer(function (this: any) {
        const instance = container.create(key, ...args);
        const fieldName = context.name;
        this[fieldName] = instance;
      });
    };

  public registerFactory<
    K extends keyof IM,
    F extends FactoryClass<any, IM[K]>,
  >(key: K, factory: F): void {
    if (this.#factories.has(key)) {
      throw new Error(`injectable '${factory.name}' already registered`);
    }
    this.#factories.set(key, factory);
  }

  public registerClass<K extends keyof IM>(
    key: K,
    target: new (...args: IM[K]) => any,
  ): void {
    if (this.#injectables.has(key)) {
      throw new Error(`injectable '${target.name}' already registered`);
    }
    this.#injectables.set(key, { type: "class", cls: target });
  }

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
    if (entry?.type === "class") {
      return new entry.cls(...args);
    }
    let factory: IFactory<any, IM[K]>;
    if (entry) {
      factory = entry.factory;
    } else {
      const factoryClass = this.#factories.get(key);
      if (!factoryClass) {
        throw new Error(`injectable ${String(key)} not registered`);
      }
      factory = new factoryClass();
      this.#injectables.set(key, { type: "factory", factory });
    }
    return factory.produce(...args);
  }
}

export const Container = new ContainerInstance();
