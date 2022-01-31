//
// Created by reemuru 1/28/2022.
//

#ifndef XMREG01_POSTGRESDB_H
#define XMREG01_POSTGRESDB_H

#include <iostream>
#include <pqxx/pqxx>
#include "../ext/fmt/format.h"

using namespace std;
using namespace pqxx;

namespace xmreg
{
    /**
     * @brief Postgresql database operations class.
     * 
     */
    class PostgresDB
    {
        string dbname, username, password, host, port, connection_str;

        public:
            PostgresDB(string &_dbname, string &_username, string &_password, string &_host, string &_port)
                : dbname{_dbname},
                  username{_username},
                  password{_password},
                  host{_host},
                  port{_port}
        {
            this->connection_str = fmt::format("dbname = {} user = {} password = {} hostaddr = {} port = {}", 
                                   dbname, username, password, host, port);
        }

        void configure_db(connection* C, work* W);

        void prepare_all(connection* C);

        string get_connection_string();
    };

}

#endif //XMREG01_POSTGRESDB_H
