# install packages as required
my_packages <- c("DBI", "RODBCDBI", "readr", "igraph", "tidygraph", "networkD3", "shiny")
not_installed <- my_packages[!(my_packages %in% installed.packages()[ , "Package"])]
if(length(not_installed))
  install.packages(not_installed, repos='http://cran.us.r-project.org')