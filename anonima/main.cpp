#include "ext/crow.h"
#include "json.hpp"
#include <cstdio>
#include <string>

using json = nlohmann::json;
using namespace std;

namespace anonima
{
struct htmlresponse: public crow::response
{
    htmlresponse(string&& _body)
            : crow::response {std::move(_body)}
    {
        add_header("Content-Type", "text/html; charset=utf-8");
    }
};

struct jsonresponse: public crow::response
{
    jsonresponse(const nlohmann::json& _body)
            : crow::response {_body.dump()}
    {
        add_header("Access-Control-Allow-Origin", "*");
        add_header("Access-Control-Allow-Headers", "Content-Type");
        add_header("Content-Type", "application/json");
    }
};
}

int main()
{
    crow::SimpleApp app;


    CROW_ROUTE(app, "/")([](){
        // sample json use
        struct test {
            string value;
        };
        struct test a;
        a.value = "test";
        test *b = &a;
        json j;
        j["key"] = b->value;
        anonima::jsonresponse r{j};
        return r;
    });

    app.port(4321).run();
}