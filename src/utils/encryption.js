const MAX_SEC = 20;
const MAX_ITEM = 20;
const BASIC_NUM = 40;
const secret = [
  [
    191, 71, 77, 46, 58, 49, 44, 43, 55, 101, 122, 45, 124, 137, 237, 117, 71,
    76, 129, 120,
  ],
  [
    114, 41, 45, 212, 49, 59, 14, 58, 46, 57, 133, 225, 219, 116, 222, 211, 119,
    95, 128, 146,
  ],
  [
    81, 71, 44, 50, 218, 89, 44, 113, 115, 111, 122, 95, 41, 137, 137, 67, 112,
    76, 129, 90,
  ],
  [
    40, 117, 120, 126, 78, 79, 54, 133, 110, 81, 91, 95, 94, 47, 57, 66, 82, 60,
    122, 70,
  ],
  [
    80, 71, 122, 122, 128, 91, 94, 73, 45, 51, 213, 75, 214, 57, 77, 60, 232,
    116, 120, 130,
  ],
  [
    114, 72, 54, 46, 78, 79, 212, 112, 115, 118, 122, 52, 54, 77, 117, 67, 222,
    127, 91, 40,
  ],
  [
    51, 70, 128, 99, 121, 89, 74, 113, 155, 111, 124, 45, 90, 87, 77, 47, 82,
    76, 129, 120,
  ],
  [
    111, 77, 47, 57, 78, 59, 94, 113, 115, 121, 128, 51, 44, 47, 77, 67, 52, 66,
    69, 80,
  ],
  [
    117, 74, 71, 35, 48, 49, 41, 43, 65, 70, 129, 115, 124, 71, 57, 70, 82, 76,
    119, 110,
  ],
  [
    79, 57, 137, 136, 75, 49, 141, 239, 31, 116, 98, 57, 40, 117, 93, 84, 81,
    170, 190, 121,
  ],
  [
    121, 51, 71, 40, 54, 149, 74, 42, 57, 104, 112, 145, 134, 127, 167, 127, 76,
    41, 122, 132,
  ],
  [
    84, 42, 42, 212, 46, 59, 11, 41, 46, 57, 133, 225, 219, 116, 222, 231, 119,
    95, 128, 146,
  ],
  [
    83, 78, 47, 51, 211, 89, 43, 113, 115, 111, 122, 95, 141, 137, 137, 67, 122,
    76, 129, 92,
  ],
  [
    42, 127, 220, 122, 178, 79, 54, 133, 110, 81, 91, 95, 94, 47, 57, 66, 81,
    60, 122, 71,
  ],
  [
    81, 70, 142, 121, 138, 91, 94, 73, 45, 51, 213, 175, 214, 57, 77, 60, 212,
    116, 120, 120,
  ],
  [
    54, 78, 44, 43, 77, 79, 112, 142, 115, 118, 122, 52, 54, 77, 147, 67, 222,
    137, 111, 70,
  ],
  [
    61, 74, 118, 89, 122, 83, 74, 113, 55, 111, 124, 45, 90, 87, 77, 47, 82, 76,
    129, 220,
  ],
  [
    121, 87, 87, 67, 784, 52, 94, 113, 95, 121, 128, 51, 44, 47, 77, 67, 52, 66,
    69, 55,
  ],
  [
    97, 71, 70, 45, 481, 42, 41, 43, 65, 70, 129, 115, 114, 71, 57, 70, 82, 76,
    119, 44,
  ],
  [
    69, 52, 90, 46, 70, 41, 141, 239, 31, 116, 98, 57, 140, 117, 93, 84, 81,
    170, 190, 77,
  ],
];

const getRandomIntInclusive = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getKeySecret = () => {
  let randomRange = MAX_SEC - 1;
  let randomNumber = getRandomIntInclusive(0, randomRange);
  return randomNumber;
};

const encrypt = (InStr) => {
  let outEncryptStr = [];
  let StrLen = InStr.length;
  let j = 0;
  let key = 0;
  let X = 0,
    Num = 0;
  key = getKeySecret();
  outEncryptStr.push(key + BASIC_NUM);
  for (let i = 0; i < StrLen; i++) {
    X = InStr[i] + secret[key][j];

    j += 1;

    if (j == MAX_ITEM) {
      j = 0;
    }
    Num = 0;
    if (X > BASIC_NUM) {
      Num = parseInt(X / BASIC_NUM);
      X = (X % BASIC_NUM) + BASIC_NUM;
    }
    outEncryptStr.push(Num + BASIC_NUM);
    outEncryptStr.push(X);
  }

  return outEncryptStr;
};

export const encryptString = (originalData) => {
  let utf8 = unescape(encodeURIComponent(originalData));
  let textToEncrypt = [];
  for (var i = 0; i < utf8.length; i++) {
    textToEncrypt.push(utf8.charCodeAt(i));
  }

  let mNumberArray = encrypt(textToEncrypt);

  let str = "";
  for (let j = 0; j < mNumberArray.length; j++) {
    str = str.concat(String.fromCharCode(mNumberArray[j]));
  }
  return str;
};

export default { encryptString };
