import { expect, it } from "vitest";
import { ContainerInstance } from "./container";

interface IDoor {
  name: string;
}

interface IMaterial {
  material: string;
}

it("should inject simple public field", () => {
  const C = new ContainerInstance();

  @C.Injectable("door")
  class Door implements IDoor {
    private static index = 0;

    constructor() {
      Door.index += 1;
    }

    public get name(): string {
      return `door ${Door.index}`;
    }
  }

  @C.Injectable("room")
  class Room {
    @C.Inject("door")
    public door!: Door;
  }

  class House {
    @C.Inject("door")
    public door!: Door;

    @C.Inject("room")
    public room!: Room;
  }

  const house = new House();
  expect(house.door.name).toBe("door 1");
  expect(house.room.door.name).toBe("door 1");
  expect(house.room.door).toBe(house.door);
});

it("should inject into subclass", () => {
  const C = new ContainerInstance();

  @C.Injectable("door")
  class Door implements IDoor {
    public name = "door";
  }

  class House {
    @C.Inject("door")
    public door!: Door;
  }

  class Townhouse extends House {}

  const house = new Townhouse();
  expect(house.door.name).toBe("door");
});

it("should inject the same factory product", () => {
  const C = new ContainerInstance();

  @C.Factory("door")
  class DoorFactory {
    public produce(): IDoor {
      return { name: "door" };
    }
  }

  class House {
    @C.Inject("door")
    public door!: IDoor;
  }

  const house1 = new House();
  const house2 = new House();
  expect(house1.door).toBe(house2.door);
});

it("should inject into factory", () => {
  const C = new ContainerInstance();

  @C.Injectable("material")
  class Steel implements IMaterial {
    public readonly material = "steel";
  }

  @C.Factory("door")
  class DoorFactory {
    @C.Inject("material")
    public readonly material!: IMaterial;

    public produce(): IDoor {
      return { name: `${this.material.material} door` };
    }
  }

  class House {
    @C.Inject("door")
    public door!: IDoor;
  }

  const house = new House();
  expect(house.door.name).toBe("steel door");
});

it("should inject transient instances", () => {
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

  class Cabin {
    @C.Transient("door", "small", "green")
    public door!: IDoor;
  }

  class WrongHouse {
    @C.Transient("door", 1, 2)
    public door!: IDoor;
  }

  const house = new House();
  const cabin = new Cabin();

  expect(house.red.name).toBe("large red door");
  expect(house.blue.name).toBe("large blue door");
  expect(cabin.door.name).toBe("small green door");
});

it("injected fields should be available inside constructor", () => {
  const C = new ContainerInstance();

  @C.Factory("door")
  class DoorFactory {
    public produce(size: string, color: string): IDoor {
      return { name: `${size} ${color} door` };
    }
  }

  class House {
    @C.Transient("door", "large", "red")
    public readonly door!: IDoor;

    public readonly name: string;

    constructor(style: string) {
      this.door = { ...this.door, name: `wooden ${this.door.name}` };
      this.name = `${style} house with ${this.door.name}`;
    }
  }

  const house = new House("rural");
  expect(house.name).toBe("rural house with wooden large red door");
});

it("should register factory without decorator", () => {
  const C = new ContainerInstance();

  class DoorFactory {
    public produce(): IDoor {
      return { name: "door" };
    }
  }
  C.registerFactory("door", DoorFactory);

  class House {
    @C.Inject("door")
    public door!: IDoor;
  }

  const house = new House();
  expect(house.door.name).toBe("door");
});

it("should register class without decorator", () => {
  const C = new ContainerInstance();

  class Door {
    private static index = 0;
    public readonly name: string;

    constructor() {
      Door.index += 1;
      this.name = `door ${Door.index}`;
    }
  }
  C.registerClass("door", Door);

  class House {
    @C.Inject("door")
    public door!: IDoor;
  }

  const house1 = new House();
  const house2 = new House();
  expect(house1.door.name).toBe("door 1");
  expect(house1.door.name).toBe(house2.door.name);
});
