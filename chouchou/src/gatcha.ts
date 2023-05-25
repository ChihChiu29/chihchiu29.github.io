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

  // Compute with a single price config; result in text.
  function computeSinglePriceConfig(
    priceConfig: PriceConfig,
    numberRemainingConfigs: NumberRemainingInfo[]): string[] {

    let totalAvailable = math.sum(
      numberRemainingConfigs.map(c => c.numberRemaining));

    let report = [`一次抽${priceConfig.numberOfTickets}的话，抽中至少一个的中奖概率和成本是：`];
    for (const config of numberRemainingConfigs) {
      let probNotGetIt = 1;
      if (priceConfig.numberOfTickets >= totalAvailable) {
        probNotGetIt = 0;
      } else {
        for (let i = 1; i <= priceConfig.numberOfTickets; i++) {
          probNotGetIt *= 1 - config.numberRemaining / (totalAvailable - i);
        }
      }
      const prob = 1 - probNotGetIt;
      report.push(
        `${config.tier}: ${(prob * 100).toFixed(2)}%, $${(priceConfig.price / prob).toFixed(1)}`);
    }

    return report;
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

