# install packages as required
install.packages("RODBC", repos='http://cran.us.r-project.org')
# when using odbc RODBC must be installed first
my_packages <- c("RODBCDBI", "odbc", "readr", "data.table", "cluster", "NbClust",
  "factoextra", "psych", "party", "ggplot2", "reshape2", "shiny", "igraph", "tidygraph",
  "networkD3")
not_installed <- my_packages[!(my_packages %in% installed.packages()[ , "Package"])]
if(length(not_installed))
  install.packages(not_installed, repos='http://cran.us.r-project.org') 