import { useState, useEffect } from "react";
import { abi } from "@vite/vitejs";
import { Buffer } from "buffer";

export function BuyCoffeeRecords(props: {
  address: string;
  abi: any[];
  provider: any;
}) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const provider = props.provider;
    const contractAbi = props.abi;
    const address = props.address;

    (async () => {
      const es = await await scanEvents(
        provider,
        contractAbi,
        address,
        "0",
        "Buy"
      );
      if(es){
        setEvents(es);
      }
    })();

    return () => {
      // this now gets called when the component unmounts
    };
  }, [props]);

  const listItems = events.map(
    (event: {
      hash: string;
      event: { from: string; to: string; num: number };
    }) => (
      <li key={event.hash}>
        {event.event.from} {event.event.to} {event.event.num}
      </li>
    )
  );
  return (
    <div>
      <p>Total: {events.length}</p>
      <ul>{listItems}</ul>
    </div>
  );
}
// ---------------------
async function scanEvents(
  provider: any,
  abi: any[],
  address: string,
  fromHeight: string,
  eventName: string
) {
  let heightRange = {
    [address]: {
      fromHeight: fromHeight.toString(),
      toHeight: "0",
    },
  };
  // console.log(JSON.stringify(heightRange));
  const vmLogs = await provider.request("ledger_getVmLogsByFilter", {
    addressHeightRange: heightRange,
  });

  if (!vmLogs) {
    return [];
  }
  const eventAbi = abi.find(
    (item: { name: string; type: string }) =>
      item.type === "event" && item.name === eventName
  );

  const events = vmLogs.filter((x: any) => {
    return encodeLogId(eventAbi) === x.vmlog.topics[0];
  });

  if (!events || events.length === 0) {
    return [];
  }

  return events.map((input: any) => {
    const event: any = decodeEvent(input.vmlog, abi, eventName);
    return {
      event: event,
      height: input.accountBlockHeight,
      hash: input.accountBlockHash,
    };
  });
}

function decodeEvent(
  log: any,
  abiArr: Array<{ name: string; type: string }>,
  name: string
) {
  const result = abi.decodeLog(
    abiArr,
    Buffer.from(log.data ? log.data : "", "base64").toString("hex"),
    log.topics.slice(1, log.topics.length),
    name
  );
  return Object.assign(result, { name: name });
}

function encodeLogId(item: { name: string; type: string }) {
  let id = "";
  if (item.type === "function") {
    id = abi.encodeFunctionSignature(item);
  } else if (item.type === "event") {
    id = abi.encodeLogSignature(item);
  }
  return id;
}
