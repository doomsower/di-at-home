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
    public name = "door";
  }

  class House {
    @C.Inject("door")
    public door!: Door;
  }

  const house = new House();
  expect(house.door.name).toBe("door");
});

it("should inject only once", () => {
  const C = new ContainerInstance();

  @C.Injectable("door")
  class Door implements IDoor {
    private static index = 0;

    public constructor() {
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

it("should inject factory product", () => {
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

  const house = new House();
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

    constructor() {
      this.name = `house with ${this.door.name}`;
    }
  }

  const house = new House();
  expect(house.name).toBe("house with large red door");
});
