import { defaults, Person } from '@covis/shared';
import { FileService } from '@covis/shared-backend';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { createWriteStream } from 'fs';
import { join } from 'path';

const reportEach = 1_000_000;

interface ProcessOptions {
  inputFile: string;
  outputFolder: string;
}

@Injectable()
export class AppService {
  constructor(private fileService: FileService, private logger: ConsoleLogger) {
    this.logger.setContext('Processing');
  }

  /**
   * Process the location file and generate
   *
   * @param options The options
   */
  public async process({
    inputFile,
    outputFolder,
  }: ProcessOptions): Promise<void> {
    try {
      this.logger.log(`Started for '${inputFile}'.`);
      const outFile = createWriteStream(join(outputFolder, 'history.csv'));
      const personsDb = createWriteStream(join(outputFolder, 'persons.json'));

      personsDb.write('[\n');

      await this.fileService.readByLine({ path: inputFile }, (line, index) => {
        // Skip the header
        if (index++ === 0) {
          return;
        }

        const [
          time,
          personId,
          personType,
          age,
          gender,
          homeId,
          homeSubId,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _currentActivity,
          currentLat,
          currentLon,
          homeLat,
          homeLon,
          diseasePhase,
          workId,
          schoolId,
        ] = line.split(',').map((val) => this.removeQuotes(val));

        outFile.write(
          `${[
            time,
            personId,
            currentLat.replace(`${defaults.lat}.`, ''),
            currentLon.replace(`${defaults.lon}.`, ''),
            diseasePhase[0],
          ].join(',')}\n`
        );

        if (time === '0.0') {
          const person: Person = {
            id: personId,
            type: personType,
            age: parseInt(age, 10),
            gender: gender,
            homeId: homeId,
            homeSubId: homeSubId,
            homeLat: parseFloat(homeLat),
            homeLon: parseFloat(homeLon),
            workId: workId,
            schoolId: schoolId,
          };

          personsDb.write(
            `${JSON.stringify(person)}${person.id !== '0' ? ',' : ''}\n`
          );
        }

        if (index % reportEach === 0) {
          this.logger.log(
            `Processed ${index / reportEach} millions of records.`
          );
        }
      });

      personsDb.write(']\n');
      [personsDb, outFile].forEach((file) => file.end());

      this.logger.log(`Finished for: '${inputFile}'.`);
    } catch (err) {
      console.error(err);
    }
  }

  private removeQuotes(value: string): string {
    return value[0] === '"' ? value.slice(1, -1) : value;
  }
}
