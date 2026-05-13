const form = document.querySelector("#addressForm");
const printLayout = document.querySelector("#printLayout");
const printSheet = document.querySelector("#printSheet");
const statusText = document.querySelector("#statusText");

const fields = {
  toPostal: document.querySelector("#toPostal"),
  toAddress: document.querySelector("#toAddress"),
  toName: document.querySelector("#toName"),
  toHonorific: document.querySelector("#toHonorific"),
  toPhone: document.querySelector("#toPhone"),
  fromPostal: document.querySelector("#fromPostal"),
  fromAddress: document.querySelector("#fromAddress"),
  fromName: document.querySelector("#fromName"),
  fromPhone: document.querySelector("#fromPhone"),
  itemName: document.querySelector("#itemName"),
  offsetX: document.querySelector("#offsetX"),
  offsetY: document.querySelector("#offsetY"),
  printScale: document.querySelector("#printScale"),
  replyEnvelope: document.querySelector("#replyEnvelope"),
};

const previews = {
  toPostal: document.querySelector("#previewToPostal"),
  toAddress: document.querySelector("#previewToAddress"),
  toName: document.querySelector("#previewToName"),
  toHonorific: document.querySelector("#previewHonorific"),
  toPhone: document.querySelector("#previewToPhone"),
  fromPostal: document.querySelector("#previewFromPostal"),
  fromAddress: document.querySelector("#previewFromAddress"),
  fromName: document.querySelector("#previewFromName"),
  fromPhone: document.querySelector("#previewFromPhone"),
  itemName: document.querySelector("#previewItemName"),
  replyToPostal: document.querySelector("#replyToPostal"),
  replyToAddress: document.querySelector("#replyToAddress"),
  replyToName: document.querySelector("#replyToName"),
  replyToPhone: document.querySelector("#replyToPhone"),
  replyFromPostal: document.querySelector("#replyFromPostal"),
  replyFromAddress: document.querySelector("#replyFromAddress"),
  replyFromName: document.querySelector("#replyFromName"),
  replyFromPhone: document.querySelector("#replyFromPhone"),
  replyItemName: document.querySelector("#replyItemName"),
};

const lookupStatuses = {
  toPostal: document.querySelector("#toLookupStatus"),
  fromPostal: document.querySelector("#fromLookupStatus"),
};

const lookupState = {
  toPostal: { lastZip: "", timer: 0 },
  fromPostal: { lastZip: "", timer: 0 },
};

const sampleData = {
  toPostal: "100-0001",
  toAddress: "東京都千代田区千代田1-1\n丸の内ビル 10F",
  toName: "山田 太郎",
  toHonorific: "様",
  toPhone: "03-1234-5678",
  fromPostal: "150-0001",
  fromAddress: "東京都渋谷区神宮前1-1-1\nサンプルマンション101",
  fromName: "佐藤 花子",
  fromPhone: "090-1234-5678",
  itemName: "書類",
  offsetX: "0",
  offsetY: "0",
  printScale: "100",
  replyEnvelope: false,
};

function normalizePostal(value) {
  const digits = value.replace(/[^\d]/g, "");

  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return value.trim();
}

function setText(element, value) {
  element.textContent = value.trim();
}

function getPostalDigits(value) {
  return value.replace(/[^\d]/g, "");
}

function setLookupStatus(postalKey, message, isError = false) {
  const status = lookupStatuses[postalKey];

  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("error", isError);
}

function formatAddress(result) {
  return `${result.address1}${result.address2}${result.address3}`;
}

async function lookupAddress(postalKey, addressKey, force = false) {
  const zip = getPostalDigits(fields[postalKey].value);

  if (zip.length !== 7) {
    setLookupStatus(postalKey, "郵便番号は7桁で入力してください。", true);
    return;
  }

  if (!force && lookupState[postalKey].lastZip === zip) {
    return;
  }

  lookupState[postalKey].lastZip = zip;
  setLookupStatus(postalKey, "住所を検索しています...");

  try {
    const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);

    if (!response.ok) {
      throw new Error("住所検索に失敗しました。");
    }

    const data = await response.json();

    if (data.status !== 200 || !data.results?.length) {
      setLookupStatus(postalKey, "該当する住所が見つかりませんでした。", true);
      return;
    }

    fields[addressKey].value = formatAddress(data.results[0]);
    fields[postalKey].value = normalizePostal(zip);
    setLookupStatus(postalKey, "住所を入力しました。番地以降を追記してください。");
    updatePreview();
  } catch (error) {
    setLookupStatus(postalKey, "住所検索サービスに接続できませんでした。", true);
  }
}

function scheduleAddressLookup(postalKey, addressKey) {
  clearTimeout(lookupState[postalKey].timer);
  setLookupStatus(postalKey, "");

  if (getPostalDigits(fields[postalKey].value).length !== 7) {
    return;
  }

  lookupState[postalKey].timer = setTimeout(() => {
    lookupAddress(postalKey, addressKey);
  }, 450);
}

function updatePreview() {
  setText(previews.toPostal, normalizePostal(fields.toPostal.value));
  setText(previews.toAddress, fields.toAddress.value);
  setText(previews.toName, fields.toName.value);
  setText(previews.toHonorific, fields.toHonorific.value === "なし" ? "" : fields.toHonorific.value);
  setText(previews.toPhone, fields.toPhone.value);
  setText(previews.fromPostal, normalizePostal(fields.fromPostal.value));
  setText(previews.fromAddress, fields.fromAddress.value);
  setText(previews.fromName, fields.fromName.value);
  setText(previews.fromPhone, fields.fromPhone.value);
  setText(previews.itemName, fields.itemName.value);
  setText(previews.replyToPostal, normalizePostal(fields.fromPostal.value));
  setText(previews.replyToAddress, fields.fromAddress.value);
  setText(previews.replyToName, fields.fromName.value);
  setText(previews.replyToPhone, fields.fromPhone.value);
  setText(previews.replyFromPostal, normalizePostal(fields.toPostal.value));
  setText(previews.replyFromAddress, fields.toAddress.value);
  setText(previews.replyFromName, fields.toName.value);
  setText(previews.replyFromPhone, fields.toPhone.value);
  setText(previews.replyItemName, fields.itemName.value);

  const offsetX = Number(fields.offsetX.value || 0);
  const offsetY = Number(fields.offsetY.value || 0);
  const scale = Math.max(90, Math.min(110, Number(fields.printScale.value || 100))) / 100;

  document.documentElement.style.setProperty("--offset-x", `${offsetX}mm`);
  document.documentElement.style.setProperty("--offset-y", `${offsetY}mm`);
  document.documentElement.style.setProperty("--print-scale", String(scale));
  printLayout.classList.toggle("show-reply", fields.replyEnvelope.checked);

  const printMode = fields.replyEnvelope.checked ? "A4横左右・返信レターパックあり" : "A4横左半分";
  statusText.textContent = `${printMode}・倍率${Math.round(scale * 100)}%・横${offsetX}mm・縦${offsetY}mm`;
}

function fillSample() {
  Object.entries(sampleData).forEach(([key, value]) => {
    if (fields[key].type === "checkbox") {
      fields[key].checked = value;
      return;
    }

    fields[key].value = value;
  });
  updatePreview();
}

form.addEventListener("input", updatePreview);
form.addEventListener("change", updatePreview);
form.addEventListener("reset", () => {
  requestAnimationFrame(updatePreview);
});

fields.toPostal.addEventListener("input", () => scheduleAddressLookup("toPostal", "toAddress"));
fields.fromPostal.addEventListener("input", () => scheduleAddressLookup("fromPostal", "fromAddress"));
fields.toPostal.addEventListener("blur", () => lookupAddress("toPostal", "toAddress"));
fields.fromPostal.addEventListener("blur", () => lookupAddress("fromPostal", "fromAddress"));

document.querySelectorAll(".lookup-button").forEach((button) => {
  button.addEventListener("click", () => {
    lookupAddress(button.dataset.postal, button.dataset.address, true);
  });
});

document.querySelector("#sampleButton").addEventListener("click", fillSample);
document.querySelector("#printButton").addEventListener("click", () => {
  updatePreview();
  window.print();
});

printSheet.addEventListener("dblclick", fillSample);

fillSample();
