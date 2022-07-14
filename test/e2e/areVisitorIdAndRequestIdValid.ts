export function areVisitorIdAndRequestIdValid(visitorId: string, requestId: string): boolean {
  const isVisitorIdFormatValid = /^[a-zA-Z\d]{20}$/.test(visitorId)
  const isRequestIdFormatValid = /^\d{13}\.[a-zA-Z\d]{6}$/.test(requestId)
  return isRequestIdFormatValid && isVisitorIdFormatValid
}
