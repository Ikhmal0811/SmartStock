START TRANSACTION;

                ALTER TABLE stock_movements
                ALTER COLUMN created_at
                TYPE timestamp with time zone
                USING created_at AT TIME ZONE 'Asia/Kuala_Lumpur';
            

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261104180009_ConvertStockMovementTimestampToUtc', '10.0.4');

COMMIT;

