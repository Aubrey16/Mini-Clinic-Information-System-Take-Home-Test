export function ok(res, data = null, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function fail(res, errors = {}, message = 'Error', status = 400) {
  return res.status(status).json({ success: false, message, errors });
}
