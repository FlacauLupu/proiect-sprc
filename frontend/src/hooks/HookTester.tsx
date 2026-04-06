import useHook from "./useHook";

const HookTester = () => {
  // Just calling it here triggers all the useEffects inside the hook
  useHook();

  return (
    <div style={{ padding: "20px", background: "#eee" }}>hffdhgfsdfsdfds</div>
  );
};

export default HookTester;
