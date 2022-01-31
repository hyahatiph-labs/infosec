//
// Created by reemuru on 1/28/2022.
//

#include "PostgresDB.h"

namespace xmreg
{

    /**
     * @brief Connect to the Postgresql database.
     * Create the thread and reply tables for saving data.
     * @param connection
     */
    void
    PostgresDB::configure_db(connection* C, work* W)
    {
        char *thread_sql;
        char *reply_sql;
        try
        {
            if (C->is_open())
            {
                cout << "Opened database successfully: " << C->dbname() << endl;
            }
            else
            {
                cout << "Can't open database" << endl;
                exit(EXIT_FAILURE);
            }

            /* Create thread SQL statement */
            thread_sql = "CREATE TABLE THREADS("
                         "ID             INT       PRIMARY KEY     NOT NULL,"
                         "SUBADDRESS     CHAR(128)                 NOT NULL,"
                         "TEXT           TEXT                      NOT NULL,"
                         "CREATED_ON     INT                       NOT NULL,"
                         "BUMPED_ON      INT                       NOT NULL,"
                         "DELETE_KEY     CHAR(256)                 NOT NULL,"
                         "REPORTED       BOOLEAN);";

            /* Create Replies SQL statement */
            reply_sql = "CREATE TABLE REPLIES("
                        "ID             INT     PRIMARY KEY NOT NULL,"
                        "THREAD_ID      INT                 NOT NULL,"
                        "TEXT           TEXT                NOT NULL,"
                        "CREATED_ON     INT                 NOT NULL,"
                        "DELETE_KEY     CHAR(256),"
                        "REPORTED       BOOLEAN,"
                        "CONSTRAINT FK_REPLY FOREIGN KEY(THREAD_ID)"
                        "REFERENCES THREADS(ID));";

            /* Execute SQL queries */
            W->exec(thread_sql);
            W->exec(reply_sql);
            W->commit();
            cout << "Tables created successfully" << endl;
        }
        catch (const std::exception &e)
        {
            cerr << e.what() << std::endl;
        }
    }

    /**
     * @brief Prepare all SQL statements here.
     * 
     * @param C 
     */
    void
    PostgresDB::prepare_all(connection* C)
    {
        /* Create prepared statements*/
        C->prepare("find_all_threads","SELECT * FROM THREADS");
        C->prepare("find_all_replies","SELECT * FROM REPLIES WHERE THREAD_ID = $1");
        C->prepare("save_thread","INSERT INTO THREADS values($1, $2, $3, $4, $5, $6)");
        C->prepare("save_reply","INSERT INTO REPLIES values($1, $2, $3, $4, $5, $6)");
    }

    /**
     * @brief This is the getter for the db connection string.
     * 
     * @return string 
     */
    string
    PostgresDB::get_connection_string()
    {
        return this->connection_str;
    }
}
