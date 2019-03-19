import { createContext } from 'react';

const JinagaContext = createContext({
  get jinaga() { throw new Error(`Looks like you forgot to pass a Jinaga\
  instance to your context provider!`); }
});
export default JinagaContext;