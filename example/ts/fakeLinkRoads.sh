npm pack ../../

dir="."
mypattern="roads-*.tgz"
unset -v latest
for file in "$dir"/*; do
  [[ ${file##*/} == $mypattern ]] && [[ $file -nt $latest ]] && latest=$file
done

npm install $latest