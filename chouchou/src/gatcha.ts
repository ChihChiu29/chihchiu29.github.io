namespace chouchou {
  interface GenericConfig {
    key: string;
    value: number;
  }

  export interface PriceConfig {
    numberOfTickets: number;
    price: number;
  }

  export interface NumberRemainingInfo {
    tier: string;
    numberRemaining: number;
  }

  export interface AllConfig {
    priceConfigs: PriceConfig[];
    numberRemainingConfigs: NumberRemainingInfo[];
  }

  export namespace dom {
    export let numberOfGatchaConfigInput: HTMLInputElement =
      document.querySelector('#number-gatcha-config')!;
    export let numberOfTierConfigInput: HTMLInputElement =
      document.querySelector('#number-tier-config')!;

    export let calculationResultArea = document.querySelector('#calculation-result')!;

    // Needs to be called after DOM is ready.
    export function updateReference() {
      numberOfGatchaConfigInput = document.querySelector('#number-gatcha-config')!;
      numberOfTierConfigInput = document.querySelector('#number-tier-config')!;
      calculationResultArea = document.querySelector('#calculation-result')!;
    }
  }

  // Fills variables in `config` from config values.
  export function parseConfigs(): AllConfig {
    const priceConfigs = [];
    for (const rawConfig of parseCommaSeparatedConfigString(
      dom.numberOfGatchaConfigInput.value)) {
      priceConfigs.push({
        numberOfTickets: parseInt(rawConfig.key),
        price: rawConfig.value,
      });
    }

    const numberRemainingConfigs = []
    for (const rawConfig of parseCommaSeparatedConfigString(
      dom.numberOfTierConfigInput.value)) {
      numberRemainingConfigs.push({
        tier: rawConfig.key,
        numberRemaining: rawConfig.value,
      });
    }

    return { priceConfigs, numberRemainingConfigs };
  }

  function parseCommaSeparatedConfigString(config: string): GenericConfig[] {
    const configResult: GenericConfig[] = [];
    for (const configFragment of config.split(',')) {
      const frags = configFragment.trim().split(':');
      configResult.push({ key: frags[0], value: parseInt(frags[1]) });
    }
    return configResult;
  }

  // Compute and generate report in texts.
  export function compute(
    priceConfigs: PriceConfig[],
    numberRemainingConfigs: NumberRemainingInfo[]): string[] {
    const allReports = [];
    for (const priceConfig of priceConfigs) {
      for (const sentence of computeSinglePriceConfig(
        priceConfig, numberRemainingConfigs)) {
        allReports.push(sentence);
      }
      allReports.push('--------------------');
    }
    return allReports;
  }

  function computeSinglePriceConfig(
    priceConfig: PriceConfig,
    numberRemainingConfigs: NumberRemainingInfo[]): string[] {

    let numTotalRemainingItems = Maths.sum(
      numberRemainingConfigs.map(c => c.numberRemaining));

    let report = [
      `一次抽${priceConfig.numberOfTickets}的话，抽中至少一个的中奖概率和成本`];
    for (const itemTierConfig of numberRemainingConfigs) {
      report.push();
      const singleReportHeader = `>>> 对于${itemTierConfig.tier} <<< `;
      const singleReportContent: string[] = [];
      let cumulatedNotGetProb = 1;
      let expectedCost = 0;
      for (const [idx, prob] of computeProbGet(
        itemTierConfig.numberRemaining,
        numTotalRemainingItems,
        priceConfig.numberOfTickets).entries()) {
        const numBuy = idx + 1;
        const cost = priceConfig.price * numBuy;
        singleReportContent.push(
          `${numBuy}次：${(prob * 100).toFixed(2)}%, $${cost}`);

        expectedCost += cumulatedNotGetProb * prob * cost;
        cumulatedNotGetProb *= (1 - prob);
      }
      const singleReportSummary = `总体期望支出：$${expectedCost.toFixed(0)}`;
      report.push(`${singleReportHeader}
        <b>${singleReportSummary}</b>, 每次买的细节：
        ${singleReportContent.join(', ')}`);
    }

    return report;
  }

  // Returns an array of probabilies for not being able to get an item in a
  // sequence of gatcha, starting with 1 pull, and ending with prob 0.
  export function computeProbNotGet(numAvailable: number, total: number): number[] {
    if (numAvailable > total) {
      throw new Error(
        `numAvailable(${numAvailable}) cannot be larger than total(${total})`);
    }

    if (numAvailable <= 0) {
      return [1];
    }

    const results: number[] = [];
    let remaining = total;
    while (numAvailable <= remaining) {
      results.push(1 - numAvailable / remaining);
      remaining--;
    }
    return results;
  }

  // Returns an array of probabilities for being able to get at least one item
  // in a sequence of gatcha, when pulls are batched.
  export function computeProbGet(
    numAvailable: number,
    total: number,
    numBatch: number): number[] {
    const notProbs = computeProbNotGet(numAvailable, total);

    return Arrays.splitArrayIntoChunk(notProbs, numBatch).map(
      chunk => (1 - Maths.product(chunk)));
  }

  export function writeReport(report: string[]): void {
    dom.calculationResultArea.innerHTML = '';
    for (const sentence of report) {
      const p = document.createElement('p');
      p.innerHTML = sentence;
      dom.calculationResultArea.appendChild(p);
    }
  }
}

namespace chouchouTest {
  export function testComputations() {
    let result;

    result = chouchou.computeProbNotGet(2, 5);
    Tests.assertAlmostEq(result[0], 3 / 5);
    Tests.assertAlmostEq(result[1], 2 / 4);
    Tests.assertAlmostEq(result[2], 1 / 3);
    Tests.assertAlmostEq(result[3], 0 / 2);

    result = chouchou.computeProbNotGet(0, 5);
    Tests.assertEq(result.length, 1);
    Tests.assertAlmostEq(result[0], 1);

    result = chouchou.computeProbGet(1, 10, 5);
    Tests.assertAlmostEq(result[0], 0.5);
    Tests.assertAlmostEq(result[1], 1);
  }
}