import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ResponseType } from "../types/ResponseType";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const checkCommandResponse = async (
  responseId: number,
  responsesRef: RefObject<Array<ResponseType>>,
) => {
  await sleep(100);
  const found = responsesRef.current.find(
    (res) => Math.abs(res.responseId) === responseId,
  );

  if (found !== undefined)
    responsesRef.current.splice(responsesRef.current.indexOf(found), 1);

  return found;
};

export default checkCommandResponse;
