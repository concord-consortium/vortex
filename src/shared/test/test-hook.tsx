// adapted from https://dev.to/itsjoekent/write-functional-tests-for-react-hooks-4b07

import React from "react";
import { shallow, mount } from "enzyme";
import { act } from "react-dom/test-utils";

// used to test simple hooks that don't use other hooks that need to be resolved
export const testHook = (runHook: any, flushEffects = true) => {
  const HookWrapper = () => <span data-output={runHook()} />;
  let wrapper: any;
  act(() => {
    wrapper = flushEffects ? mount(<HookWrapper />) : shallow(<HookWrapper />);
  });
  return wrapper.find("span").prop("data-output");
};

// used to test hooks that use other hooks like useEffect/useState
// act() will not return until those other hooks are resolved, including the setters from useState
// if you see warnings about setters in your tests you should switch to this async tester
export const testAsyncHook = async (runHook: any, flushEffects = true) => {
  const HookWrapper = () => <span data-output={runHook()} />;
  let wrapper: any;
  await act(async () => {
    wrapper = flushEffects ? mount(<HookWrapper />) : shallow(<HookWrapper />);
  });
  return wrapper.find("span").prop("data-output");
};
