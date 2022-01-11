#include "crow.h"
#include "json.hpp"

using json = nlohmann::json;

int main()
{
    crow::SimpleApp app;

    CROW_ROUTE(app, "/")([](){
        // sample json use
        json j = "{\"test\":\"value\"}";
        return j;
    });

    app.port(4321).run();
}