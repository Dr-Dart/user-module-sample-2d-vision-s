
import { IDartDatabase, Context, ModuleContext } from 'dart-api';
import { SixNumArray } from 'dart-api';
import { TCPClientState } from '../type';
const TABLE_VISIONDB_NAME = 'VisionDB';
const TABLE_VISIONDB_COLUMNS = ['visionDBId', 'CalibrationPoseData', 'VisionInputData'];
const ID_VISIONDB = 'saved-data';
const initialData = {}
interface VisionData {
  tcpState: TCPClientState;
  VisionJob: number;
  ShootPose: SixNumArray;
  VisionPose: SixNumArray;
  PickingPose: SixNumArray;
}
interface VisionDataState {
  visionData: VisionData;
}

class DatabaseManager {
  private db: IDartDatabase | null;
  constructor() {
    this.db = null;


  }

  initDatabase = async (moduleContext: ModuleContext) => {
    this.db = moduleContext.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;
    const result = await this.db?.createTable(TABLE_VISIONDB_NAME, TABLE_VISIONDB_COLUMNS, true);
    if (result) {
      const queryResult = await this.db?.query(TABLE_VISIONDB_NAME, TABLE_VISIONDB_COLUMNS, {});

      if (queryResult?.length === 0) {
        await this.db?.insert(TABLE_VISIONDB_NAME, [ID_VISIONDB, JSON.stringify(initialData), JSON.stringify(initialData)])
          .then(() => {

          });
      }
    }
  }

  save = (updateData: VisionData) => {
    this.db
      ?.query(TABLE_VISIONDB_NAME, TABLE_VISIONDB_COLUMNS, {
        visionDBId: ID_VISIONDB,
      })
      .then((queryResult) => {
        if (queryResult.length > 0) {
          this.db
            ?.update(
              TABLE_VISIONDB_NAME,
              {
                visionDBId: ID_VISIONDB,
              },
              {
                visionDBId: ID_VISIONDB,
                VisionInputData: JSON.stringify(updateData),
              },
            )
            .then((count) => {
              if (count === 0) {
                //업데이트된 값이 없으면
                this.db
                  ?.delete(TABLE_VISIONDB_NAME, {
                    visionDBId: ID_VISIONDB,
                  })
                  .then(() => {
                    //db삭제후 삽입
                    this.db?.insert(TABLE_VISIONDB_NAME, [ID_VISIONDB, JSON.stringify(updateData)]);
                  });
              }
            });
        } else {
          this.db?.insert(TABLE_VISIONDB_NAME, [ID_VISIONDB, JSON.stringify(updateData)]);
        }
      });
  };




};

export default new DatabaseManager();
