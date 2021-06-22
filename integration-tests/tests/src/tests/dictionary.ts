import { expect } from "chai";
import Realm from "realm";

describe("Realm dictionary", () => {
    beforeEach(() => {
        Realm.clearTestState();
    });

    describe("objects", () => {
        it("can be created", () => {
            interface IDictionary {
                a: Realm.Dictionary;
                b: Realm.Dictionary;
            }
            const DictSchemaRef = {
                name: "Dictionary",
                properties: {
                    a: "{}",
                    b: "{}",
                },
            };

            //Shouldn't throw
            let realm = new Realm({ schema: [DictSchemaRef] });
            realm.write(() =>
                realm.create<IDictionary>(DictSchemaRef.name, {
                    a: { x: 1, y: 2, z: 3 },
                    b: { name: "Ceasar", second: "August" },
                }),
            );

            let data = realm.objects<IDictionary>(DictSchemaRef.name)[0].a;
            let person = realm.objects<IDictionary>(DictSchemaRef.name)[0].b;

            expect(typeof data).to.equal("object");
            expect(data.x).to.equal(1);
            expect(data.y).to.equal(2);
            expect(data.z).to.equal(3);

            expect(typeof person).to.equal("object");
            expect(person.name).to.equal("Ceasar");
            expect(person.second).to.equal("August");

            realm.close();
        });
    });
});
