export function convertEventToText(num) {
  // event_type: -3, auto reply
  // event_type: 1, sent
  // event_type: 2, opened
  let str = "";
  switch (num) {
    case -1:
      str = "bounce";
      break;
    case 1:
      str = "sent";
      break;
    case 2:
      str = "opened";
      break;
    case -3:
      str = "auto reply";
      break;

    default:
      str = num;
      break;
  }

  return str;
}
