import { describe } from "mocha";
import { expect } from "chai";
const vite = require("viteshop");
import config from "./vite.config.json";

let provider: any;
let deployer: any;

describe("test Cafe", () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);
    // console.log('deployer', deployer.address);
  });

  it("test buy coffee", async () => {
    // compile
    const compiledContracts = await vite.compile("Cafe.solpp");
    expect(compiledContracts).to.have.property("Cafe");

    // deploy
    let cafe = compiledContracts.Cafe;
    cafe.setDeployer(deployer).setProvider(provider);
    await cafe.deploy({});
    expect(cafe.address).to.be.a("string");
    console.log(cafe.address);

    // check default balance
    expect(await cafe.balance()).to.be.equal('0');
    // check default value of data
    let result = await cafe.query("price", []);
    console.log("return", result);
    expect(result)
      .to.be.an("array")
      .with.lengthOf(1);
    expect(result![0]).to.be.equal("1000000000000000000");

    // call Cafe.buyCoffee(to, numOfCups);
    const block = await cafe.call(
      "buyCoffee",
      ["vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caf", 2],
      { amount: "2000000000000000000" }
    );

    // console.log(block);
    const events = await cafe.getPastEvents('Buy', {fromHeight: block.height, toHeight: block.height});
    expect(events)
      .to.be.an("array")
      .with.lengthOf(1);
    expect(events[0]?.returnValues?.from).to.be.equal(deployer.address);
    expect(events[0]?.returnValues?.to).to.be.equal(
      "vite_3345524abf6bbe1809449224b5972c41790b6cf2e22fcb5caf"
    );
    expect(events[0]?.returnValues?.num).to.be.equal("2");

    expect(await cafe.balance()).to.be.equal('0');
  });
});