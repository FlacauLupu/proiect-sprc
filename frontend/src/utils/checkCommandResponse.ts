const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const checkCommandResponse = async (
  commandId: number,
  responses: Array<number>,
) => {
  while (true) {
    await sleep(100);
    const found = responses.find((res) => Math.abs(res) === commandId);

    if (found !== undefined) {
      const index = responses.indexOf(found);
      responses.splice(index, 1);
      return found;
    }
  }
};

export default checkCommandResponse;
