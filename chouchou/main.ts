function calculate() {
  try {
    const allConfig = chouchou.parseConfigs();
    const report = chouchou.compute(allConfig.priceConfigs,
      allConfig.numberRemainingConfigs);
    chouchou.writeReport(report);
  } catch (err) {
    alert(err);
  }
}

function main() {
  chouchou.dom.updateReference();
}

window.addEventListener('DOMContentLoaded', function () {
  main();
});