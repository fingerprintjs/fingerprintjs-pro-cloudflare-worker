declare module '*.ejs' {
  const value: <T>(args: T) => string
  export default value
}
