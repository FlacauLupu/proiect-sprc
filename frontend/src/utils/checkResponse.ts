const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const checkResponse = async (
    responses: Uint8Array<ArrayBufferLike>[] | null,
    command: number,
) => {
    while (true) {
        const result = responses?.find((res) => Math.abs(res[1]) === command);
        if (result !== undefined) return result;
        sleep(100);
    }
};

export default checkResponse;
