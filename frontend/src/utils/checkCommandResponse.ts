import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ResponseType } from "../types/ResponseType";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const checkCommandResponseUtil = (
  responseId: number,
  responsesRef: RefObject<Array<ResponseType>>,
) => {
  const found = responsesRef.current.find(
    (res) => Math.abs(res.responseId) === responseId,
  );

  if (found !== undefined)
    responsesRef.current.splice(responsesRef.current.indexOf(found), 1);

  return found;
};

const checkCommandResponseAsync = async (
  responseId: number,
  responsesRef: RefObject<Array<ResponseType>>,
  waitMs: number,
) => {
  await sleep(waitMs);
  return checkCommandResponseUtil(responseId, responsesRef);
};

const checkCommandResponse = (
  responseId: number,
  responsesRef: RefObject<Array<ResponseType>>,
) => {
  return checkCommandResponseUtil(responseId, responsesRef);
};

export { checkCommandResponse, checkCommandResponseAsync };
