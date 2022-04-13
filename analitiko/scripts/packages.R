local({r <- getOption("repos")
         r["CRAN"] <- "http://cran.r-project.org"
         options(repos=r)})
  
  install.packages(c("DBI", "RODBC", "odbc", "dplyr", "RODBCDBI",
    "readr", "data.table", "cluster", "NbClust", "factoextra",
    "psych", "party", "ggplot2", "reshape2", "shiny",
    "igraph", "tidygraph", "networkD3", "curl"))
