# Dependency Injection at Home

Simple dependency injection using typescript ECMA decorators

## Usage

### Simple Public Field Injection

```typescript
import { ContainerInstance } from "./container";

const C = new ContainerInstance();

@C.Injectable("door")
class Door {
  public name = "door";
}

class House {
  @C.Inject("door")
  public door!: Door;
}

const house = new House();
console.log(house.door.name); // "door"
```

### Singleton Injection

```typescript
const C = new ContainerInstance();

@C.Injectable("door")
class Door {
  private static index = 0;

  constructor() {
    Door.index += 1;
  }

  public get name(): string {
    return `door ${Door.index}`;
  }
}

class House {
  @C.Inject("door")
  public door!: Door;
}

const house = new House();
console.log(house.door.name); // "door 1"
```

### Transient Instances Injection

```typescript
const C = new ContainerInstance<{
  door: [string, string];
}>();

@C.Factory("door")
class DoorFactory {
  public produce(size: string, color: string): IDoor {
    return { name: `${size} ${color} door` };
  }
}

class House {
  @C.Transient("door", "large", "red")
  public red!: IDoor;

  @C.Transient("door", "large", "blue")
  public blue!: IDoor;
}

const house = new House();
console.log(house.red.name); // "large red door"
console.log(house.blue.name); // "large blue door"
```

Please refer to the test cases in `src/container.test.ts` for more examples.
